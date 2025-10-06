const architectures = ['arm', 'arm64', 'amd64', '386']

export interface ImageHostValidationResult {
  valid: boolean
  message?: string
}

export class ImageHost {
  private raw: string = ''
  schema = ''
  username = ''
  password = ''
  host = ''
  port = ''
  architecture = ''
  catalogId = ''
  version = ''

  parse(imageUrl: string) {
    this.raw = imageUrl
    const schemaParts = imageUrl.split('://')
    if (schemaParts.length === 1) {
      this.schema = 'https'
      imageUrl = schemaParts[0]
    } else {
      this.schema = schemaParts[0]
      imageUrl = schemaParts[1]
    }

    const lastAtSignIndex = imageUrl.lastIndexOf('@')
    if (lastAtSignIndex !== -1) {
      const user = imageUrl.slice(0, lastAtSignIndex)
      const firstIndexOfColon = user.indexOf(':')
      if (firstIndexOfColon === -1) {
        this.username = user
      } else {
        this.username = user.slice(0, firstIndexOfColon)
        this.password = user.slice(firstIndexOfColon + 1, user.length)
      }

      imageUrl = imageUrl.slice(lastAtSignIndex + 1, imageUrl.length)
    }

    if (imageUrl.endsWith('/')) {
      imageUrl = imageUrl.slice(0, -1)
    }

    const hostParts = imageUrl.split('/')
    this.host = hostParts[0]
    const hostNameParts = hostParts[0].split(':')
    if (hostNameParts.length === 1) {
      this.host = hostNameParts[0]
    } else if (hostNameParts.length === 2) {
      this.host = hostNameParts[0]
      this.port = hostNameParts[1]
    }

    if (hostParts.length === 2) {
      this.catalogId = hostParts[1]
      this.architecture = this.getOsArch()
      this.version = 'latest'
      return
    }

    if (hostParts.length === 3) {
      let foundAarch = false
      for (const arch of architectures) {
        if (hostParts[1] === arch) {
          this.catalogId = hostParts[2]
          this.architecture = arch
          this.version = 'latest'
          foundAarch = true
          break
        }
      }
      if (!foundAarch) {
        this.catalogId = hostParts[1]
        this.architecture = this.getOsArch()
        this.version = hostParts[2]
      }
    }

    if (hostParts.length === 4) {
      this.catalogId = hostParts[2]
      this.architecture = hostParts[1]
      this.version = hostParts[3]
    }
  }

  getHost(): string {
    let host = `${this.schema}://`
    if (this.username !== '') {
      if (this.password !== '') {
        host += `${this.username}:${this.password}@${this.host}`
      } else {
        host += `${this.username}@${this.host}`
      }
    }
    if (this.port !== '') {
      host += `:${this.port}`
    }

    return host
  }

  getConnectionString(): string {
    return `host=${this.getHost()}`
  }

  validate(): ImageHostValidationResult {
    const result: ImageHostValidationResult = {
      valid: false
    }

    if (this.schema === '') {
      result.message = 'Schema is missing'
      return result
    }
    if (
      this.schema !== 'http' &&
      this.schema !== 'https' &&
      this.schema !== 'local'
    ) {
      result.message = 'Invalid schema'
      return result
    }

    if (this.host === '') {
      result.message = 'Host is missing'
      return result
    }

    if (this.catalogId === '') {
      result.message = 'Catalog ID is missing'
      return result
    }

    result.valid = true
    return result
  }

  private getOsArch() {
    return process.arch
  }
}

export default ImageHost
