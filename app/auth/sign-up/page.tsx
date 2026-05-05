"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Heart, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signUp } from "@/lib/actions/auth"

const passwordRequirements = [
  { label: "Minimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiuscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minuscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um numero", test: (p: string) => /[0-9]/.test(p) },
  { label: "Um caractere especial", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await signUp(formData)

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(result.errors)
        } else if (result.error) {
          setError(result.error)
        }
        return
      }

      router.push("/auth/sign-up-success")
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Comece a registrar suas memorias juntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
                required
                disabled={isLoading}
                aria-invalid={!!fieldErrors.displayName}
              />
              {fieldErrors.displayName && (
                <p className="text-sm text-destructive">{fieldErrors.displayName}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.password}
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 rounded-md bg-muted p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
                  <ul className="flex flex-col gap-1">
                    {passwordRequirements.map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-2 text-xs ${
                          req.test(password) ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        {req.test(password) ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.confirmPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ja tem uma conta?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
