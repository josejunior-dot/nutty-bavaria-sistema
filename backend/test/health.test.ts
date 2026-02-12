import { describe, it, expect, afterAll } from 'vitest'
import { getTestApp, closeTestApp } from './helpers/test-app.js'

describe('Health Check', () => {
  afterAll(async () => {
    await closeTestApp()
  })

  it('GET /api/health should return 200', async () => {
    const app = await getTestApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('status', 'ok')
  })
})
