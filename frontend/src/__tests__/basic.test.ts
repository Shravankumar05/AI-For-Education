describe('Basic Test Suite', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  test('should test async operations', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })
})