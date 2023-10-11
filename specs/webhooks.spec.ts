
import { Resource } from '@commercelayer/sdk/lib/cjs/resource'
import { denormalizePayload } from '../src'



/*
beforeAll(async () => {
	await initialize()
})

afterEach(() => {
	jest.resetAllMocks()
})
*/


describe('sdk-utils.webhooks suite', () => {

	it('webhooks.parse', async () => {

		const type = 'shipments'
		const reference = 'myReferenceId'
	
		const payload = `
		{
			"data": {
			"id": "AbcdEfgHiL",
			"meta": {
			  "mode": "test",
			  "organization_id": "myOrgId"
			},
			"type": "${type}",
			"links": {
			  "self": "/api/${type}/AbcdEfgHiL"
			},
			"attributes": {
			  "metadata": {},
			  "reference": "${reference}",
			  "created_at": "2023-10-01T05:53:29.296Z",
			  "updated_at": "2023-10-10T08:52:13.251Z"
			}
		  }
		}
		`
	
		const res = denormalizePayload(payload) as Resource
	
		expect(res.type).toBe(type)
		expect(res.reference).toBe(reference)
	
	  })

})
