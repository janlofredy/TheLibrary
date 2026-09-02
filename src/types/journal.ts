export type WoodMaterial = 'walnut' | 'oak' | 'mahogany' | 'birch' | 'midnight'
export type NameplateStyle = 'brass' | 'silver' | 'matte-black' | 'bronze'
export type SpineStyle = 'ribbed-leather' | 'gold-foil' | 'woven-cloth' | 'modern-matte' | 'vintage-parchment'
export type TitleFont = 'serif' | 'roman' | 'typewriter' | 'calligraphy' | 'sans'
export type TitleColor = 'gold' | 'silver' | 'white' | 'copper' | 'black'
export type LayerMode = 'standing' | 'leaning-left' | 'leaning-right' | 'horizontal-stack'
export type PaperStyle = 'lined' | 'dotted' | 'parchment' | 'slate'
export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'stormy'

export interface Library {
  id: string
  name: string
  description?: string
  woodMaterial: WoodMaterial
  createdAt: string
  updatedAt: string
}

export interface Shelf {
  id: string
  libraryId: string
  name: string
  nameplateStyle: NameplateStyle
  order: number
  createdAt: string
  updatedAt: string
}

export interface Book {
  id: string
  shelfId: string
  title: string
  subtitle?: string
  spineColor: string
  spineStyle: SpineStyle
  titleColor: TitleColor
  titleFont: TitleFont
  ribbonColor: string
  hasRibbon: boolean
  slotIndex: number
  layerMode: LayerMode
  stackOrder: number
  pageCount: number
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  bookId: string
  pageNumber: number
  title: string
  entryDate: string
  paperStyle: PaperStyle
  mood?: Mood
  tags: string[]
  wordCount: number
  content: string | Record<string, unknown>
  plainText?: string
  createdAt: string
  updatedAt: string
}

export interface BookSizing {
  width: number
  height: number
  rotationDeg: number
  leanOffset: number
  topEdgeDetail: boolean
}
