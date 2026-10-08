import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Kolam } from '@/components/ui/Ornament'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Kolam className="text-turmeric-500" size={96} />
      <h1 className="font-display text-[30px] text-stone-900">This page does not exist</h1>
      <p className="max-w-sm text-[15px] text-stone-500">
        The link may be out of date. Start again from the donor home or the admin console.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button>Donor home</Button>
        </Link>
        <Link to="/console">
          <Button variant="secondary">Admin console</Button>
        </Link>
      </div>
    </div>
  )
}
