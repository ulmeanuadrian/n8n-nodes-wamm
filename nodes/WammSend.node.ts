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

// Definește baseURL aici pentru a fi accesibil
const WAMM_BASE_URL = 'https://app.wamm.pro/api';

export class WammSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAMM WhatsApp',
		name: 'wammSend',
		icon: 'file:../assets/wamm.png',
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
			baseURL: WAMM_BASE_URL, // Folosește constanta definită
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
				required: false,
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
		let responseDataFromApi;
		const allReturnData: IDataObject[] = [];

		// Folosește direct constanta WAMM_BASE_URL
		const baseURL = WAMM_BASE_URL; 

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i, 'sendMessage') as string;

			try {
				if (operation === 'sendMessage') {
					const credentials = await this.getCredentials('wammApi') as IWammCredentials;
					const instanceId = this.getNodeParameter('instanceId', i) as string;
					const phone = this.getNodeParameter('phone', i) as string;
					const message = this.getNodeParameter('message', i) as string;
					const time = this.getNodeParameter('time', i, '') as string;

					const fullUrl = `${baseURL}/send`; // Construiește URL-ul complet

					const qs: IDataObject = {
						number: phone,
						type: 'text',
						instance_id: instanceId,
						access_token: credentials.token,
						message: message,
					};

					if (time) {
						qs.time = time;
					}

					this.logger.debug(`WAMM Node - Requesting URL: "${fullUrl}"`);
					this.logger.debug(`WAMM Node - QueryString: ${JSON.stringify(qs)}`);
					// this.logger.debug(`WAMM Node - Headers: ACCESS-TOKEN: ${credentials.token}:${credentials.email}`);


					responseDataFromApi = await this.helpers.request({
						method: 'GET',
						url: fullUrl,  // Folosește URL-ul complet aici
						qs,
						json: true,
						headers: {
							'ACCESS-TOKEN': `${credentials.token}:${credentials.email}`,
						},
					});

					if (responseDataFromApi.status !== 'success' && responseDataFromApi.ok !== true && responseDataFromApi.message !== "ok") { 
						this.logger.warn(`WAMM API a returnat un posibil eșec: ${JSON.stringify(responseDataFromApi)}`);
						// throw new NodeApiError(this.getNode(), responseDataFromApi, { message: `WAMM API error: ${responseDataFromApi.message || 'Unknown error'}` });
					}

					allReturnData.push({
						success: true, 
						apiResponse: responseDataFromApi,
						phone,
						instanceId,
						timestamp: new Date().toISOString(),
					});
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					allReturnData.push({
						error: error.message || 'Eroare necunoscută în WAMM Send',
						itemDetails: items[i].json,
					});
					continue;
				}
				// if (error.response && error.response.data) {
				// 	throw new NodeApiError(this.getNode(), error.response.data, { message: `WAMM API request failed: ${error.message}` });
				// }
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(allReturnData)];
	}
}