import { ICredentialType, NodePropertyTypes } from 'n8n-workflow';

export class WammApi implements ICredentialType {
	name = 'wammApi';
	displayName = 'WAMM API';
	documentationUrl = 'https://wamm.pro/apidoc/';
	properties = [
		{
			displayName: 'Access Token',
			name: 'token',
			type: 'string' as NodePropertyTypes,
			required: true,
			typeOptions: { password: true },
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string' as NodePropertyTypes,
			required: true,
		},
	];
}
