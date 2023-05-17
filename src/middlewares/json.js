export async function json(req, res) {
	if (!('content-type' in req.headers && req.headers['content-type'].includes('multipart/form-data'))) {
		const buffers = []
	
		for await (const chunk of req) {
			buffers.push(chunk)
		}
	
		try {
			req.body = JSON.parse(Buffer.concat(buffers).toString())
		} catch {
			req.body = null
		}
	}

	res.setHeader('Content-type', 'application/json')
}