// verified against OpenAPI spec (GET /provider/coach-page-templates — CoachPageTemplateResponseDto)

export interface CoachPageTemplate {
  id: string
  code: string
  name: string
  description: string | null
  previewImageUrl: string | null
  sectionsAvailable: string[]
}
