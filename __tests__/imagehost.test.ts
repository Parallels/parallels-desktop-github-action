import { ImageHost } from '../src/image_host'

describe('ImageHost', () => {
  let imageHost: ImageHost

  beforeEach(() => {
    imageHost = new ImageHost()
  })

  it('should parse the image URL correctly with strange password', () => {
    const imageUrl =
      'catalog://root:te@s:t@localhost:55670/arm/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('te@s:t')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe('arm')
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly with strong password', () => {
    const imageUrl =
      'catalog://root:te@st@localhost:55670/arm/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('te@st')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe('arm')
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly', () => {
    const imageUrl =
      'catalog://root:test@localhost:55670/arm/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe('arm')
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly detecting architecture and version', () => {
    const imageUrl =
      'catalog://root:test@localhost:55670/arm/build agent template'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe('arm')
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly without architecture', () => {
    const imageUrl =
      'catalog://root:test@localhost:55670/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly without host port', () => {
    const imageUrl =
      'catalog://root:test@example.com/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('example.com')
    expect(imageHost.port).toBe('')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly without password', () => {
    const imageUrl = 'catalog://root@example.com/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('')
    expect(imageHost.host).toBe('example.com')
    expect(imageHost.port).toBe('')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('latest')
  })
  it('should parse the image URL correctly without user and password', () => {
    const imageUrl = 'catalog://example.com/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('')
    expect(imageHost.password).toBe('')
    expect(imageHost.host).toBe('example.com')
    expect(imageHost.port).toBe('')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly without architecture and version', () => {
    const imageUrl = 'catalog://root:test@localhost:55670/build agent template'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('latest')
  })

  it('should parse the image URL correctly with just id and version', () => {
    const imageUrl =
      'catalog://root:test@localhost:55670/build agent template/v1'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('catalog')
    expect(imageHost.username).toBe('root')
    expect(imageHost.password).toBe('test')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe(process.arch)
    expect(imageHost.version).toBe('v1')
  })

  it('should handle image URLs without schema', () => {
    const imageUrl = 'localhost:55670/arm/build agent template/latest'
    imageHost.parse(imageUrl)

    expect(imageHost.schema).toBe('https')
    expect(imageHost.username).toBe('')
    expect(imageHost.password).toBe('')
    expect(imageHost.host).toBe('localhost')
    expect(imageHost.port).toBe('55670')
    expect(imageHost.catalogId).toBe('build agent template')
    expect(imageHost.architecture).toBe('arm')
    expect(imageHost.version).toBe('latest')
  })
  it('should validate the image host with missing schema', () => {
    imageHost.schema = ''
    imageHost.host = 'localhost'
    imageHost.catalogId = 'build agent template'

    const validationResult = imageHost.validate()

    expect(validationResult.valid).toBe(false)
    expect(validationResult.message).toBe('Schema is missing')
  })

  it('should validate the image host with invalid schema', () => {
    imageHost.schema = 'invalid'
    imageHost.host = 'localhost'
    imageHost.catalogId = 'build agent template'

    const validationResult = imageHost.validate()

    expect(validationResult.valid).toBe(false)
    expect(validationResult.message).toBe('Invalid schema')
  })

  it('should validate the image host with missing host', () => {
    imageHost.schema = 'http'
    imageHost.host = ''
    imageHost.catalogId = 'build agent template'

    const validationResult = imageHost.validate()

    expect(validationResult.valid).toBe(false)
    expect(validationResult.message).toBe('Host is missing')
  })

  it('should validate the image host with missing catalog ID', () => {
    imageHost.schema = 'http'
    imageHost.host = 'localhost'
    imageHost.catalogId = ''

    const validationResult = imageHost.validate()

    expect(validationResult.valid).toBe(false)
    expect(validationResult.message).toBe('Catalog ID is missing')
  })

  it('should validate the image host with valid inputs', () => {
    imageHost.schema = 'http'
    imageHost.host = 'localhost'
    imageHost.catalogId = 'build agent template'

    const validationResult = imageHost.validate()

    expect(validationResult.valid).toBe(true)
    expect(validationResult.message).toBeUndefined()
  })

  // Add more test cases to cover different scenarios
})
