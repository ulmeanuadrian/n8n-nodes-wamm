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

const WAMM_BASE_URL = 'https://app.wamm.pro/api';

export class WammSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAMM PRO',
		name: 'wammpro',
		icon: 'file:wamm.png',
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
			baseURL: WAMM_BASE_URL,
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
					{
						name: 'Send Media & File',
						value: 'sendMedia',
						description: 'Send media or file via WhatsApp',
						action: 'Send media or file via WhatsApp',
					},
					{
						name: 'Send Template',
						value: 'sendTemplate',
						description: 'Send a template message via WhatsApp',
						action: 'Send a template message via WhatsApp',
					},
					{
						name: 'Add to Contact List',
						value: 'addToList',
						description: 'Add a contact to a list',
						action: 'Add a contact to a list',
					},
					{
						name: 'Remove from Contact List',
						value: 'removeFromList',
						description: 'Remove a contact from a list or all lists',
						action: 'Remove a contact from a list or all lists',
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
			},
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				required: true,
				default: '',
				placeholder: '40712345678',
				description: 'Phone number in international format (without +)',
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
						operation: ['sendMessage', 'sendMedia'],
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
						operation: ['sendMessage', 'sendMedia', 'sendTemplate'],
					},
				},
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				required: true,
				default: '',
				description: 'URL to the media file you want to send',
				displayOptions: {
					show: {
						operation: ['sendMedia'],
					},
				},
			},
			{
				displayName: 'Template ID',
				name: 'template',
				type: 'string',
				required: true,
				default: '',
				description: 'ID of the template to send',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
			},
			{
				displayName: 'Template Parameters',
				name: 'templateParams',
				type: 'string',
				required: false,
				default: '{}',
				description: 'JSON string of parameters to replace in template (e.g., {"param1":"value1","param2":"value2"})',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
			},
			{
				displayName: 'List ID',
				name: 'listId',
				type: 'string',
				required: true,
				default: '',
				description: 'ID of the contact list',
				displayOptions: {
					show: {
						operation: ['addToList', 'removeFromList'],
					},
				},
			},
			{
				displayName: 'Remove from All Lists',
				name: 'removeAll',
				type: 'boolean',
				required: false,
				default: false,
				description: 'If true, will remove contact from all lists',
				displayOptions: {
					show: {
						operation: ['removeFromList'],
					},
				},
			},
			{
				displayName: 'Contact Parameters',
				name: 'contactParams',
				type: 'string',
				required: false,
				default: '{}',
				description: 'JSON string of parameters for the contact (e.g., {"param1":"value1","param2":"value2"})',
				displayOptions: {
					show: {
						operation: ['addToList'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let responseDataFromApi;
		const allReturnData: IDataObject[] = [];

		const baseURL = WAMM_BASE_URL;

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i, 'sendMessage') as string;

			try {
				const credentials = await this.getCredentials('wammApi') as IWammCredentials;
				const instanceId = this.getNodeParameter('instanceId', i) as string;
				const phone = this.getNodeParameter('phone', i) as string;

				let endpoint = '';
				const qs: IDataObject = {
					instance_id: instanceId,
					access_token: credentials.token,
					number: phone,
				};

				if (operation === 'sendMessage') {
					endpoint = '/send';
					qs.type = 'text';
					qs.message = this.getNodeParameter('message', i) as string;
					const time = this.getNodeParameter('time', i, '') as string;
					if (time) {
						qs.time = time;
					}
				} else if (operation === 'sendMedia') {
					endpoint = '/send';
					qs.type = 'media';
					qs.message = this.getNodeParameter('message', i) as string;
					qs.media_url = this.getNodeParameter('mediaUrl', i) as string;
					const time = this.getNodeParameter('time', i, '') as string;
					if (time) {
						qs.time = time;
					}
				} else if (operation === 'sendTemplate') {
					endpoint = '/send';
					qs.type = 'template';
					qs.template = this.getNodeParameter('template', i) as string;

					const templateParams = this.getNodeParameter('templateParams', i, '{}') as string;
					try {
						qs.replace = JSON.parse(templateParams);
					} catch (e: any) {
						throw new Error(`Invalid JSON format for template parameters: ${e.message}`);
					}

					const time = this.getNodeParameter('time', i, '') as string;
					if (time) {
						qs.time = time;
					}
				} else if (operation === 'addToList') {
					endpoint = '/addtolist';
					qs.wamm_newslist_id = this.getNodeParameter('listId', i) as string;

					const contactParams = this.getNodeParameter('contactParams', i, '{}') as string;
					try {
						qs.params = JSON.parse(contactParams);
					} catch (e: any) {
						throw new Error(`Invalid JSON format for contact parameters: ${e.message}`);
					}
				} else if (operation === 'removeFromList') {
					endpoint = '/delfromlist';
					const removeAll = this.getNodeParameter('removeAll', i, false) as boolean;
					if (!removeAll) {
						qs.wamm_newslist_id = this.getNodeParameter('listId', i) as string;
					}
				}

				const fullUrl = `${baseURL}${endpoint}`;

				this.logger.debug(`WAMM Node - Requesting URL: "${fullUrl}"`);
				this.logger.debug(`WAMM Node - QueryString: ${JSON.stringify(qs)}`);

				responseDataFromApi = await this.helpers.request({
					method: 'GET',
					url: fullUrl,
					qs,
					json: true,
					headers: {
						'ACCESS-TOKEN': `${credentials.token}:${credentials.email}`,
					},
				});

				if (responseDataFromApi.status !== 'success' && responseDataFromApi.ok !== true && responseDataFromApi.message !== "ok") { 
					this.logger.warn(`WAMM API returned a possible failure: ${JSON.stringify(responseDataFromApi)}`);
				}

				allReturnData.push({
					success: true, 
					apiResponse: responseDataFromApi,
					operation,
					phone,
					instanceId,
					timestamp: new Date().toISOString(),
				});
			} catch (error: any) {
				if (this.continueOnFail()) {
					allReturnData.push({
						error: error.message || 'Unknown error in WAMM Send',
						operation,
						itemDetails: items[i].json,
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(allReturnData)];
	}
}