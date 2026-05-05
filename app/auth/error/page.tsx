"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "unknown_error"
  const description = searchParams.get("description") || "Ocorreu um erro durante a autenticacao."

  const errorMessages: Record<string, string> = {
    exchange_failed: "Falha ao processar a autenticacao. Por favor, tente novamente.",
    no_code: "Codigo de autorizacao nao encontrado. Por favor, tente fazer login novamente.",
    access_denied: "Acesso negado. Voce nao tem permissao para acessar este recurso.",
    invalid_request: "Requisicao invalida. Por favor, tente novamente.",
    unknown_error: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
  }

  const displayMessage = errorMessages[error] || description

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erro de Autenticacao</CardTitle>
          <CardDescription className="text-muted-foreground">
            {displayMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para Login</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Ir para Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse">Carregando...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
