import {randomUUID} from 'node:crypto'
import { buildRoutePath } from '../utils/build-route-path.js'
import { Database } from './database.js'
import { parse } from 'csv-parse'
import multer from 'multer'

const upload = multer()
const database = new Database()

export const routes = [
	{
		method: 'GET',
		path: buildRoutePath('/tasks'),
		handler: (req, res) => {
			const { search } = req.query

			const tasks = database.select('tasks', search ? {
				title: search,
				description: search,
			} : null)

			return res.end(JSON.stringify(tasks))
		}
	},
	{
		method: 'POST',
		path: buildRoutePath('/tasks'),
		handler: async (req, res) => {
			const taskDefaultValues = {
				id: randomUUID(),
				completed_at: null,
				created_at: new Date(),
				updated_at: new Date()
			}

			if (req.headers['content-type'].includes('multipart/form-data')) {
				upload.single('csv')(req, res, (err) => {
					if (err instanceof multer.MulterError) {
						console.log(err)
						return res.writeHead(400).end()
					} else if (err) {
						console.log(err)
						return res.writeHead(500).end()
					} else {
						const csvData = req.file.buffer.toString();
	
						parse(csvData, {delimiter: ';', from_line: 2}, (err, data) => {
							if (err) {
								console.error(err);
								return res.writeHead(500).end()
							} else {
								for(const index in data) {
									let taskData = data[index]

									let task = { title: taskData[0], description: taskData[1], ...taskDefaultValues }

									database.insert('tasks', task)
								}

								return res.writeHead(201).end()
							}
						});
					}
				})
			} else {
				const { title, description } = req.body

				let task = { title, description, ...taskDefaultValues }

				database.insert('tasks', task)

				return res.writeHead(201).end()
			}


		}
	},
	{
		method: 'PUT',
		path: buildRoutePath('/tasks/:id'),
		handler: (req, res) => {
			const { id } = req.params
			const { title, description } = req.body

			database.update('tasks', id, {
				title: title ?? null,
				description: description ?? null 
			})

			return res.writeHead(204).end()
		}
	},
	{
		method: 'PATCH',
		path: buildRoutePath('/tasks/:id/complete'),
		handler: (req, res) => {
			const { id } = req.params

			database.toggleComplete('tasks', id)

			return res.writeHead(204).end()
		}
	},
	{
		method: 'DELETE',
		path: buildRoutePath('/tasks/:id'),
		handler: (req, res) => {
			const { id } = req.params

			database.delete('tasks', id)

			return res.writeHead(204).end()
		}
	},
]