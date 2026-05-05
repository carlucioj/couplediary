"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateCouplePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const anniversaryDate = formData.get("anniversaryDate") as string

    try {
      const response = await fetch("/api/couple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          anniversaryDate: anniversaryDate || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Erro ao criar casal")
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
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Casal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Crie um novo casal e convide seu parceiro(a) com o codigo gerado
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
              <Label htmlFor="name">Nome do Casal (opcional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ex: Joao e Maria"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="anniversaryDate">Data de Aniversario (opcional)</Label>
              <Input
                id="anniversaryDate"
                name="anniversaryDate"
                type="date"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Quando voces comecaram a namorar?
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Casal"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
