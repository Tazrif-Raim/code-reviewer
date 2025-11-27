'use client';

import { signout } from '@/app/auth/action'
import { Button } from '@/components/ui/button'

export function Logout() {
  return (
      <Button
        onClick={() => signout()}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </Button>

  )
}