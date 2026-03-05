import { pixels as pixelsSchema } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { NewPixel } from '@/db/schema'
import { db } from '@/db'
import { SAMPLE_BLOCKS, SAMPLE_GROUPS } from '@/db/mock-data'

export const Route = createFileRoute('/sandbox/')({
  component: RouteComponent,
})

const seedDB = createServerFn({
  method: 'POST', // default
})
  .inputValidator((data: { pixels: NewPixel[] }) => data)
  .handler(async ({ data }) => {
    const formattedPixels = SAMPLE_BLOCKS.map((block) => {
      return {
        name: block.name,
        description: block.description,
        label: block.name,
        color: block.color,
        unit: block.unit, // unit to measure by
        type: block.type, // unit to measure by
        ownerId: 'BYk0o5v4s2BF72DL6eQnDw0XwPRDiAQj',
      }
    })
    return await db.insert(pixelsSchema).values(formattedPixels)
  })

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      Seed Function
      <form
        action={async () => {
          'use server'

          // // use SingleStore ID instead of creating our own.
          // const rootFolder = await db
          // 	.insert(folders_table)
          // 	.values({
          // 		name: "root",
          // 		ownerId: user.userId,
          // 		parent: null,
          // 		type: "folder",
          // 	})
          // 	.$returningId()

          // const insertableFolders = mockFolders.map((folder) => {
          //   const ownerId = user.userId
          //   const parent = folder.parent ? parseInt(folder.parent) : null
          //   // const id = folder.id === "root" ? 1 : parseInt(folder.id) + 1
          //   if (folder.parent === 'root') {
          //     return {
          //       name: folder.name,
          //       ownerId: ownerId,
          //       parent: 2251799813685249,
          //       type: 'folder',
          //       itemCount: folder.itemCount,
          //     }
          //   } else {
          //     return {
          //       name: folder.name,
          //       ownerId: ownerId,
          //       parent: parent,
          //       type: 'folder',
          //       itemCount: folder.itemCount,
          //     }
          //   }
          // })

          // // Update folders with matching names
          // for (const insertableFolder of insertableFolders) {
          //   await db
          //     .update(folders)
          //     .set({ parent: insertableFolder.parent })
          //     .where(eq(folders.name, insertableFolder.name))
          // }
          // const fileInsert = await db.insert(files).values(
          // 	mockFiles.map((file, index) => {
          // 		const id = index + 1
          // 		const parentId =
          // 			file.parent === "root" ? 1 : parseInt(file.parent) + 1
          // 		return {
          // 			name: file.name,
          // 			id: id,
          // 			ownerId: user?.userId ?? "1",
          // 			parent: parentId,
          // 			type: file.type,
          // 			size: file.size,
          // 			url: file.url,
          // 		}
          // 	}),
          // )
          // console.log("//// file insert - ", fileInsert)
        }}
      >
        <button type="submit">Seed</button>
      </form>
    </div>
  )
}
