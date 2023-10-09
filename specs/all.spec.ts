
import type { Sku } from '@commercelayer/sdk'
import { retrieveAll } from '../src'
import { initialize, cl } from '../test/common'
import { updateAll } from '../src/all'
import exp from 'constants'



beforeAll(async () => {
	await initialize()
})

afterEach(() => {
	jest.resetAllMocks()
})



describe('sdk-utils.all suite', () => {

	it('exports.retrieveAll', async () => {

		const skus = await retrieveAll<Sku>('skus')

		const skusCount = await cl.skus.count()

		expect(skus.meta.recordCount).toBe(skusCount)
		expect(skus.length).toBe(skusCount)

	})


	it('exports.updateAll', async () => {

		const reference_origin = String(Date.now())
		const sku = { reference_origin }

		const updRes = await updateAll('skus', sku)

		if (updRes.errors > 0) expect(updRes.processed + updRes.errors).toBe(updRes.total)
		else expect(updRes.processed).toBe(updRes.total)

		const skus = await retrieveAll<Sku>('skus')
		for (const s of skus) expect(s.reference_origin).toBe(reference_origin)

	})

})
