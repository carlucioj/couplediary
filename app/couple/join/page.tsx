"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JoinCouplePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/couple/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Codigo de convite invalido")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Ocorreu um erro inesperado. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Entrar no Casal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Digite o codigo de convite que seu parceiro(a) compartilhou com voce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="inviteCode">Codigo de Convite</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                placeholder="XXXXXXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                disabled={isLoading}
                className="text-center text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                O codigo tem 8 caracteres (letras e numeros)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || inviteCode.length !== 8}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Casal"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
