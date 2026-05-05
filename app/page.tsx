import Link from "next/link"
import { Heart, Shield, Lock, BookOpen, Camera, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">CoupleDiary</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Sua historia de amor,{" "}
            <span className="text-primary">protegida para sempre</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            CoupleDiary e o lugar seguro para voce e seu parceiro(a) registrarem memorias,
            escreverem juntos e celebrarem cada momento especial do relacionamento.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Comecar Agora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Saiba Mais</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="border-y border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Seguranca de nivel empresarial</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Seus dados mais intimos protegidos com a mesma tecnologia usada por grandes empresas
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Row Level Security</CardTitle>
                <CardDescription>
                  Cada dado e protegido no nivel do banco de dados. Apenas voce e seu parceiro tem acesso.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Lock className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Criptografia</CardTitle>
                <CardDescription>
                  Todas as comunicacoes sao criptografadas e suas senhas sao armazenadas de forma segura.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Auditoria Completa</CardTitle>
                <CardDescription>
                  Sistema de logs que rastreia todas as alteracoes para garantir a integridade dos dados.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Tudo que voces precisam</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ferramentas pensadas especialmente para casais que querem registrar sua historia
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <BookOpen className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Diario Compartilhado</CardTitle>
                <CardDescription>
                  Escrevam juntos sobre o dia a dia, sentimentos e reflexoes. 
                  Com opcao de entradas privadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>Entradas publicas e privadas</li>
                  <li>Rastreamento de humor</li>
                  <li>Busca e filtros avancados</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Camera className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Album de Memorias</CardTitle>
                <CardDescription>
                  Guardem fotos e videos dos momentos mais especiais com descricoes e tags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>Upload de fotos e videos</li>
                  <li>Tags personalizadas</li>
                  <li>Linha do tempo visual</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Datas Especiais</CardTitle>
                <CardDescription>
                  Nunca esquecam aniversarios, datas comemorativas e momentos importantes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>Lembretes automaticos</li>
                  <li>Contagem regressiva</li>
                  <li>Historico de celebracoes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Comece a escrever sua historia hoje</h2>
          <p className="mb-8 text-lg opacity-90">
            Junte-se a milhares de casais que ja estao usando o CoupleDiary para fortalecer seu relacionamento.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/sign-up">Criar Conta Gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            CoupleDiary - Desenvolvido com amor e seguranca de nivel empresarial.
          </p>
        </div>
      </footer>
    </div>
  )
}
