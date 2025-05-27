import { 
  IExecuteFunctions,
  INodeExecutionData, 
  INodeType, 
  INodeTypeDescription,
  IDataObject
} from 'n8n-workflow';

interface IWammCredentials {
  token: string;
  email: string;
}

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
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'wammApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://app.wamm.pro/api',
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
    const returnData: IDataObject[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'sendMessage') {
          const credentials = await this.getCredentials('wammApi') as IWammCredentials;
          const instanceId = this.getNodeParameter('instanceId', i) as string;
          const phone = this.getNodeParameter('phone', i) as string;
          const message = this.getNodeParameter('message', i) as string;
          const time = this.getNodeParameter('time', i, '') as string;

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

          const responseData = await this.helpers.request({
            method: 'GET',
            uri: '/send',
            qs,
            json: true,
            headers: {
              'ACCESS-TOKEN': `${credentials.token}:${credentials.email}`,
            },
          });

          if (responseData.status !== 'success') {
            throw new Error(`WAMM API error: ${responseData.message || 'Unknown error'}`);
          }

          returnData.push({
            success: true,
            ...responseData,
            phone,
            instanceId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({
            error: error.message || 'Eroare necunoscută',
            item: items[i].json,
          });
          continue;
        }
        throw error;
      }
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}
