export class ErpProcessingException extends Error {
  constructor() {
    super('ERP processing failed')
    this.name = 'ErpProcessingException'
  }
}
