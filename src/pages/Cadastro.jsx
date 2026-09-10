import { useState } from "react";
import { CampoSenha, MensagemErro } from "../components/formulario/index.js";
import { GoogleIcon } from "../components/icons/index.js";
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

export function Cadastro({
  aoVoltar,
  aoCriarConta,
  aoEntrarComGoogle,
  aoEntrar,
  aoAbrirTermos,
  aoAbrirPrivacidade,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  function limparErro(campo) {
    if (erros[campo] || erros.formulario) {
      setErros((estadoAtual) => ({
        ...estadoAtual,
        [campo]: "",
        formulario: "",
      }));
    }
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();

    const proximosErros = {};

    if (nome.trim().length < 2) proximosErros.nome = "Informe um nome válido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) proximosErros.email = "Informe um e-mail válido.";
    if (senha.length < 8) proximosErros.senha = "A senha deve ter pelo menos 8 caracteres.";
    if (!confirmacaoSenha) {
      proximosErros.confirmacaoSenha = "Confirme sua senha.";
    } else if (confirmacaoSenha !== senha) {
      proximosErros.confirmacaoSenha = "As senhas não coincidem.";
    }
    if (!aceitouTermos) proximosErros.termos = "Aceite os termos para continuar.";

    setErros(proximosErros);
    setMensagem("");

    if (Object.keys(proximosErros).length === 0) {
      setEnviando(true);
      try {
        const resultado = await aoCriarConta?.({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          aceitouTermos,
        });
        if (resultado?.message) setMensagem(resultado.message);
        setSenha("");
        setConfirmacaoSenha("");
      } catch (error) {
        setErros({
          formulario: error.message || "Não foi possível criar a conta. Tente novamente.",
        });
      } finally {
        setEnviando(false);
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f9f9ff] text-[#111c2c] selection:bg-[#d8e2ff] selection:text-[#001a41]">
      <header className="sticky top-0 z-50 flex h-14 w-full items-center bg-[#f9f9ff]/90 px-4 backdrop-blur-md">
        <button
          type="button"
          onClick={aoVoltar}
          className="grid size-10 place-items-center rounded-full text-[#424753] transition hover:bg-[#f0f3ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]"
          aria-label="Voltar para a tela de boas-vindas"
        >
          <IconeVoltar />
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-10 pt-2">
        <Mascote
          pose="joia"
          tamanho="full"
          prioridade
          animado
          alt="Lumi, mascote da LumiLibras, fazendo sinal de positivo"
          className="mb-5 max-h-48 max-w-48 drop-shadow-lg"
        />

        <h1 className="font-display mb-6 w-full text-center text-[2.5rem] font-extrabold leading-[3rem] tracking-[-0.02em] text-[#004fac]">
          Crie sua conta
        </h1>

        <form className="flex w-full flex-col gap-4" noValidate onSubmit={enviarFormulario}>
          {mensagem ? (
            <p className="rounded-xl border border-[#87aa00] bg-[#efffc0] px-4 py-3 text-sm font-medium text-[#3c4d00]" role="status">
              {mensagem}
            </p>
          ) : null}
          <MensagemErro id="cadastro-erro">{erros.formulario}</MensagemErro>

          <div className="flex flex-col gap-1">
            <label htmlFor="nome" className={`ml-1 text-sm font-semibold tracking-[0.03em] ${erros.nome ? "text-[#ba1a1a]" : "text-[#111c2c]"}`}>
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              value={nome}
              onChange={(evento) => {
                setNome(evento.target.value);
                limparErro("nome");
              }}
              placeholder="Como devemos te chamar?"
              autoComplete="name"
              aria-invalid={Boolean(erros.nome)}
              aria-describedby={erros.nome ? "nome-erro" : undefined}
              className={`${classeCampoBase} ${erros.nome ? "border-[#ba1a1a] bg-[#ffdad6] focus:border-[#ba1a1a] focus:ring-[#ffdad6]" : "border-[#727785] bg-white focus:border-[#004fac] focus:ring-[#d8e2ff]"}`}
            />
            <MensagemErro id="nome-erro">{erros.nome}</MensagemErro>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email-cadastro" className={`ml-1 text-sm font-semibold tracking-[0.03em] ${erros.email ? "text-[#ba1a1a]" : "text-[#111c2c]"}`}>
              E-mail
            </label>
            <input
              id="email-cadastro"
              name="email"
              type="email"
              value={email}
              onChange={(evento) => {
                setEmail(evento.target.value);
                limparErro("email");
              }}
              placeholder="seu@email.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(erros.email)}
              aria-describedby={erros.email ? "email-cadastro-erro" : undefined}
              className={`${classeCampoBase} ${erros.email ? "border-[#ba1a1a] bg-[#ffdad6] focus:border-[#ba1a1a] focus:ring-[#ffdad6]" : "border-[#727785] bg-white focus:border-[#004fac] focus:ring-[#d8e2ff]"}`}
            />
            <MensagemErro id="email-cadastro-erro">{erros.email}</MensagemErro>
          </div>

          <CampoSenha
            id="senha-cadastro"
            name="senha"
            label="Senha"
            value={senha}
            onChange={(evento) => {
              setSenha(evento.target.value);
              if (erros.senha || erros.confirmacaoSenha) {
                setErros((estadoAtual) => ({
                  ...estadoAtual,
                  senha: "",
                  confirmacaoSenha: "",
                }));
              }
            }}
            erro={erros.senha}
            autoComplete="new-password"
          />

          <CampoSenha
            id="confirmacao-senha"
            name="confirmacaoSenha"
            label="Confirmar senha"
            value={confirmacaoSenha}
            onChange={(evento) => {
              setConfirmacaoSenha(evento.target.value);
              limparErro("confirmacaoSenha");
            }}
            erro={erros.confirmacaoSenha}
            autoComplete="new-password"
          />

          <div className="mt-1 px-1">
            <div className="flex items-start gap-2">
              <input
                id="termos"
                type="checkbox"
                checked={aceitouTermos}
                onChange={(evento) => {
                  setAceitouTermos(evento.target.checked);
                  limparErro("termos");
                }}
                aria-invalid={Boolean(erros.termos)}
                aria-describedby={erros.termos ? "termos-erro" : undefined}
                aria-labelledby="termos-texto"
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#004fac] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]"
              />
              <p id="termos-texto" className="text-xs leading-5 text-[#424753]">
                <label htmlFor="termos" className="cursor-pointer">Li e aceito os </label>
                <button type="button" onClick={aoAbrirTermos} className="font-semibold text-[#004fac] hover:underline">
                  Termos de Serviço
                </button>{" "}
                <label htmlFor="termos" className="cursor-pointer">e declaro ciência da </label>
                <button type="button" onClick={aoAbrirPrivacidade} className="font-semibold text-[#004fac] hover:underline">
                  Política de Privacidade
                </button>
              </p>
            </div>
            <MensagemErro id="termos-erro">{erros.termos}</MensagemErro>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-[#004fac] px-6 font-display text-xl font-bold text-white shadow-[0_4px_0_#003875] transition hover:bg-[#005bbf] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff] active:translate-y-[3px] active:shadow-[0_1px_0_#003875] disabled:cursor-wait disabled:opacity-70"
          >
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>

          <div className="flex items-center gap-4 py-1" aria-hidden="true">
            <div className="h-px flex-1 bg-[#c2c6d6]" />
            <span className="text-xs font-medium uppercase text-[#727785]">ou</span>
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
        </form>

        <p className="mt-6 text-center text-base text-[#424753]">
          Já tem uma conta?{" "}
          <button type="button" onClick={aoEntrar} className="rounded font-bold text-[#004fac] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#adc6ff]">
            Entrar
          </button>
        </p>
      </main>
    </div>
  );
}
