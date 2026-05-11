declare module 'js-export-excel' {
  type ExportSheet = {
    sheetData: Record<string, unknown>[]
    sheetName: string
    sheetFilter: string[]
    sheetHeader: string[]
  }

  type ExportOptions = {
    fileName: string
    datas: ExportSheet[]
  }

  export default class ExportJsonExcel {
    constructor(options: ExportOptions)
    saveExcel(): void
  }
}
