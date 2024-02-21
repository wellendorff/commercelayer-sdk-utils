import type { BinaryToTextEncoding } from "crypto"


export const config = {
	api: {
		page_max_size: 25
	},
	exports: {
		max_size: 10_000,
		queue_size: 10
	},
	cleanups: {
		max_size: 10_000,
		queue_size: 10
	},
	imports: {
		max_size: 10_000,
		queue_size: 10
	},
	webhooks: {
		signature: {
			algorithm: 'sha256',
			digest: 'base64' as BinaryToTextEncoding,
			header: 'x-commercelayer-signature'
		},
		topic: 'x-commercelayer-topic'
	}
}
