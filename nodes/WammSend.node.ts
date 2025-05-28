import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeConnectionType
} from 'n8n-workflow';

interface IWammCredentials {
	token: string;
	email: string;
}

export class WammSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAMM WhatsApp',
		name: 'wammSend',
		icon: 'file:../assets/wamm.png', // Verifică dacă această cale este corectă relativ la fișierul JS compilat sau dacă iconița e copiată în dist/nodes
		group: ['communication'],
		version: 1,
		subtitle: 'Send WhatsApp messages via WAMM API',
		description: 'Send direct WhatsApp messages using WAMM API',
		defaults: {
			name: 'WAMM: Send Message',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'wammApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://app.wamm.pro/api', // Acest baseURL va fi folosit mai jos
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a WhatsApp message',
						action: 'Send a WhatsApp message',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				required: true,
				default: '',
				description: 'Your WAMM instance ID',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				required: true,
				default: '',
				placeholder: '40712345678',
				description: 'Phone number in international format (without +)',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Message to send',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Schedule Time',
				name: 'time',
				type: 'string',
				required: false, // Nu este obligatoriu
				default: '',
				description: 'Schedule time (YYYY-MM-DD HH:mm or now+HH:mm)',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let responseData; // Declara responseData aici pentru a fi accesibil în blocul returnData
		const allReturnData: IDataObject[] = []; // redenmit pentru a evita confuzia cu responseData de la API

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i, 'sendMessage') as string; // Prelucrează per item dacă e cazul, sau 0 dacă e global

			try {
				if (operation === 'sendMessage') {
					const credentials = await this.getCredentials('wammApi') as IWammCredentials;
					const instanceId = this.getNodeParameter('instanceId', i) as string;
					const phone = this.getNodeParameter('phone', i) as string;
					const message = this.getNodeParameter('message', i) as string;
					const time = this.getNodeParameter('time', i, '') as string; // Prelucrează 'time' per item

					// Obține baseURL din descrierea nodului
					const nodeDescription = this.getNodeDescription();
					const baseURL = nodeDescription.requestDefaults?.baseURL;

					if (!baseURL) {
						this.logger.error('baseURL lipsește din requestDefaults în descrierea nodului!');
						throw new Error('Configurare internă nod: baseURL lipsește.');
					}

					const fullUrl = `${baseURL}/send`; // Construiește URL-ul complet

					const qs: IDataObject = {
						number: phone,
						type: 'text',
						instance_id: instanceId,
						access_token: credentials.token, // Verifică dacă API-ul WAMM necesită token-ul și aici
						message: message,
					};

					if (time) {
						qs.time = time;
					}

					this.logger.debug(`WAMM Node - Requesting URL: "${fullUrl}"`);
					this.logger.debug(`WAMM Node - QueryString: ${JSON.stringify(qs)}`);
					this.logger.debug(`WAMM Node - Headers: ACCESS-TOKEN: ${credentials.token}:${credentials.email}`);


					// Stochează răspunsul API în variabila 'responseData' definită mai sus
					responseData = await this.helpers.request({
						method: 'GET',
						url: fullUrl,  // Folosește URL-ul complet
						qs,
						json: true, // Așteaptă un răspuns JSON
						headers: {
							// Verifică documentația WAMM API pentru formatul corect al header-ului de autorizare
							'ACCESS-TOKEN': `${credentials.token}:${credentials.email}`,
						},
					});

					// Verifică structura reală a răspunsului de la WAMM API.
					// Acest 'status' este un exemplu; API-ul tău poate returna altfel succesul.
					if (responseData.status !== 'success' && responseData.ok !== true && responseData.message !== "ok") { // Adaptează această condiție!
						this.logger.warn(`WAMM API a returnat un posibil eșec: ${JSON.stringify(responseData)}`);
						// Consideră aruncarea unei erori dacă răspunsul nu este cel așteptat pentru succes
						// throw new Error(`WAMM API error: ${responseData.message || JSON.stringify(responseData)}`);
					}

					allReturnData.push({
						success: true, // Sau bazează-te pe un câmp din responseData
						apiResponse: responseData, // Pune tot răspunsul API aici
						phone,
						instanceId,
						timestamp: new Date().toISOString(),
					});
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					allReturnData.push({
						error: error.message || 'Eroare necunoscută în WAMM Send',
						itemDetails: items[i].json, // Detalii despre item-ul care a eșuat
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(allReturnData)];
	}
}