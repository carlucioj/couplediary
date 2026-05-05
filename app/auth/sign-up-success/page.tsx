import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enviamos um link de confirmacao para o seu email. Por favor, clique no link para ativar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium">Nao recebeu o email?</p>
            <ul className="list-inside list-disc">
              <li>Verifique sua pasta de spam</li>
              <li>Confirme que digitou o email corretamente</li>
              <li>Aguarde alguns minutos</li>
            </ul>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Voltar para Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
