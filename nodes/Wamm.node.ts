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

export class Wamm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAMM PRO',
		icon: 'data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEw2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA1LTI4PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPmY3NGM5OGQwLTUzNWUtNGUzYi1hZmJiLWUwNTZjZDgyNDVmZDwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5VbnRpdGxlZCBkZXNpZ24gLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlv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',
		name: 'wammpro',
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