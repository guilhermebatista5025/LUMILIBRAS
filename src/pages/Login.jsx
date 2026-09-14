import { useEffect, useState } from "react";
import { CampoSenha, MensagemErro } from "../components/formulario/index.js";
import { GoogleIcon } from "../components/icons/index.js";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { Mascote } from "../components/mascote/index.js";

function IconeVoltar() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

const classeCampoBase =
  "h-12 w-full rounded-xl border-2 px-4 text-base text-[#111c2c] outline-none transition placeholder:text-[#727785] focus:ring-4";

export function Login({
  aoVoltar,
  aoEntrar,
  aoEsqueciSenha,
  aoEntrarComGoogle,
  aoCadastrar,
  erroExterno = "",
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({ email: "", senha: erroExterno });
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setErros((estadoAtual) => ({ ...estadoAtual, senha: erroExterno }));
  }, [erroExterno]);

  async function enviarFormulario(evento) {
    evento.preventDefault();

    const proximosErros = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "" : "Informe um e-mail válido.",
      senha: senha ? "" : "Informe sua senha.",
      formulario: "",
    };

    setErros(proximosErros);
    setMensagem("");

    if (!proximosErros.email && !proximosErros.senha) {
      setEnviando(true);
      try {
        const resultado = await aoEntrar?.({ email: email.trim(), senha });
        if (resultado?.message) setMensagem(resultado.message);
      } catch (error) {
        setErros((estadoAtual) => ({
          ...estadoAtual,
          formulario: error.message || "Não foi possível entrar. Tente novamente.",
        }));
      } finally {
        setEnviando(false);
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f9f9ff] text-[#111c2c] selection:bg-[#d8e2ff] selection:text-[#001a41]">
      <header className="sticky top-0 z-50 grid h-14 w-full grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[#f9f9ff] px-4">
        <button
          type="button"
          onClick={aoVoltar}
          className="grid size-10 place-items-center rounded-full text-[#424753] transition hover:bg-[#f0f3ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]"
          aria-label="Voltar para a tela de boas-vindas"
        >
          <IconeVoltar />
        </button>
        <LogoLumiLibras tamanho="sm" className="justify-center" />
        <span aria-hidden="true" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-10 pt-4">
        <div className="mb-6 flex w-full flex-col items-center">
          <div className="relative mb-5 size-32">
            <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-[#1267d6]/20 blur-xl" aria-hidden="true" />
            <Mascote
              pose="boas_vindas"
              tamanho="full"
              prioridade
              alt="Lumi, mascote da LumiLibras, dando boas-vindas"
            />
          </div>
          <h1 className="font-display text-center text-[1.75rem] font-bold leading-9 tracking-[-0.02em]">
            Bem-vindo de volta!
          </h1>
          <p className="mt-1 text-center text-base leading-6 text-[#424753]">
            Que bom te ver novamente. Pronto para praticar?
          </p>
        </div>

        <form className="w-full space-y-3" noValidate onSubmit={enviarFormulario}>
          {mensagem ? (
            <p className="rounded-xl border border-[#87aa00] bg-[#efffc0] px-4 py-3 text-sm font-medium text-[#3c4d00]" role="status">
              {mensagem}
            </p>
          ) : null}
          <MensagemErro id="login-erro">{erros.formulario}</MensagemErro>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={`text-sm font-semibold tracking-[0.03em] ${erros.email ? "text-[#ba1a1a]" : "text-[#111c2c]"}`}>
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(evento) => {
                setEmail(evento.target.value);
                if (erros.email || erros.formulario) setErros((estadoAtual) => ({ ...estadoAtual, email: "", formulario: "" }));
              }}
              placeholder="seu@email.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? "email-erro" : undefined}
              className={`${classeCampoBase} ${erros.email ? "border-[#ba1a1a] bg-[#ffdad6] focus:border-[#ba1a1a] focus:ring-[#ffdad6]" : "border-[#727785] bg-white focus:border-[#004fac] focus:ring-[#d8e2ff]"}`}
            />
            {erros.email ? (
              <MensagemErro id="email-erro">{erros.email}</MensagemErro>
            ) : null}
          </div>

          <CampoSenha
            id="senha"
            label="Senha"
            value={senha}
            onChange={(evento) => {
              setSenha(evento.target.value);
              if (erros.senha || erros.formulario) setErros((estadoAtual) => ({ ...estadoAtual, senha: "", formulario: "" }));
            }}
            erro={erros.senha}
            autoComplete="current-password"
          />

          <div className="flex justify-end pb-2 pt-1">
            <button type="button" onClick={aoEsqueciSenha} className="rounded-md text-sm font-semibold tracking-[0.03em] text-[#004fac] hover:text-[#1267d6] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-[#004fac] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_4px_0_#003875] transition hover:bg-[#005bbf] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] active:translate-y-[3px] active:shadow-[0_1px_0_#003875] disabled:cursor-wait disabled:opacity-70"
          >
            {enviando ? <><span className="login-spinner" aria-hidden="true" />Entrando...</> : "Entrar"}
          </button>
        </form>

        <div className="my-6 flex w-full items-center gap-4" aria-hidden="true">
          <div className="h-px flex-1 bg-[#c2c6d6]" />
          <span className="font-medium text-[#424753]">ou</span>
          <div className="h-px flex-1 bg-[#c2c6d6]" />
        </div>

        <button
          type="button"
          onClick={aoEntrarComGoogle}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-[#747775] bg-white px-3 text-sm font-medium tracking-[0.01em] text-[#1f1f1f] shadow-[0_3px_0_#c2c6d6] transition hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] active:translate-y-[3px] active:shadow-none"
        >
          <GoogleIcon />
          Continuar com o Google
        </button>

        <p className="mt-6 text-center text-base text-[#424753]">
          Ainda não tem uma conta?{" "}
          <button type="button" onClick={aoCadastrar} className="rounded font-bold text-[#004fac] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
            Cadastre-se
          </button>
        </p>
      </main>
    </div>
  );
}
