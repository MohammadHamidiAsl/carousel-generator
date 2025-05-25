declare module '@vercel/og' {
  import type React from 'react'
  export interface ImageResponseOptions {
    width: number
    height: number
    devicePixelRatio?: number
    // ...other fields as needed
  }
  export class ImageResponse {
    constructor(
      jsx: React.JSX.Element,
      opts: ImageResponseOptions
    )
  }
}
