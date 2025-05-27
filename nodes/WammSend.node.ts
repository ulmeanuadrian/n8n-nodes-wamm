import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface IWammCreds {
	token: string;
	email: string;
}

export class WammSend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAMM',
		name: 'wammSend',
		icon: 'file:../assets/wamm.png',
		group: ['transform'],
		version: 1,
		description: 'Send direct WhatsApp messages via WAMM',
		defaults: { name: 'WAMM: Send Message' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'wammApi', required: true }],
		properties: [
			{
				displayName: 'Instance ID',
				name: 'instanceId',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				required: true,
				placeholder: '40712345678',
				default: '',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				typeOptions: { rows: 3 },
				default: '',
			},
			{
				displayName: 'Schedule Time',
				name: 'time',
				type: 'string',
				default: '',
				description: 'Optional: YYYY-MM-DD HH:mm  sau  now+HH:mm',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const creds = (await this.getCredentials('wammApi')) as IWammCreds;
		const headerVal = `${creds.token}:${creds.email}`;

		for (let i = 0; i < items.length; i++) {
			const instanceId = this.getNodeParameter('instanceId', i) as string;
			const phone      = this.getNodeParameter('phone', i) as string;
			const msg        = this.getNodeParameter('message', i) as string;
			const time       = this.getNodeParameter('time', i, '') as string;

			const qs: Record<string, string> = {
				number:       encodeURIComponent(phone),
				type:         'text',
				instance_id:  encodeURIComponent(instanceId),
				access_token: encodeURIComponent(creds.token),
				message:      encodeURIComponent(msg),
			};
			if (time) qs.time = encodeURIComponent(time);

			const query = Object.entries(qs).map(([k, v]) => `${k}=${v}`).join('&');
			const uri   = `https://app.wamm.pro/api/send?${query}`;

			const res = await this.helpers.request!({
				method: 'GET',
				uri,
				json: true,
				headers: { 'ACCESS-TOKEN': headerVal },
			});

			if (res.status !== 'success') {
				throw new Error(`WAMM error: ${res.message ?? JSON.stringify(res)}`);
			}

			returnData.push({ json: res });
		}

		return [returnData];
	}
}
