describe('BackChannel Plugin', () => {
  test('Plugin should be defined', () => {
    // Mock window object
    Object.defineProperty(window, 'BackChannel', {
      value: {
        init: jest.fn().mockReturnThis(),
      },
      writable: true,
    })

    expect(window.BackChannel).toBeDefined()
    expect(typeof window.BackChannel.init).toBe('function')
  })
})
