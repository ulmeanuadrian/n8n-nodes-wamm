import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class WammApi implements ICredentialType {
  name = 'wammApi';
  displayName = 'WAMM API';
  documentationUrl = 'https://wamm.pro/apidoc/';
  properties: INodeProperties[] = [
    {
      displayName: 'Access Token',
      name: 'token',
      type: 'string',
      default: '',
      required: true,
      typeOptions: { 
        password: true 
      },
      description: 'Access token from WAMM API',
    },
    {
      displayName: 'Email',
      name: 'email',
      type: 'string',
      default: '',
      required: true,
      description: 'Your WAMM account email',
    },
  ];
}
