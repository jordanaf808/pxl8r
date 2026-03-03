import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ReactElement } from 'react'

export default function NotFoundComponent({
  data,
}: {
  data: Error
}): ReactElement {
  return (
    <Alert>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Something went wrong.
        <code>{JSON.stringify(data)}</code>
      </AlertDescription>
    </Alert>
  )
}
