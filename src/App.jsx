import { useEffect, useState } from "react";
import { BoasVindas } from "./pages/BoasVindas.jsx";
import { Cadastro } from "./pages/Cadastro.jsx";
import { Home } from "./pages/Home.jsx";
import { Login } from "./pages/Login.jsx";
import { Onboarding } from "./pages/Onboarding.jsx";
import { SplashScreen } from "./pages/SplashScreen.jsx";
import { authApi } from "./services/authApi.js";
import { profileApi } from "./services/profileApi.js";
import documentoLegalUrl from "../README-2.0.md?url";

function abrirDocumentoLegal() {
  window.open(documentoLegalUrl, "_blank", "noopener,noreferrer");
}

function App() {
  const [tela, setTela] = useState("splash");
  const [proximaTela, setProximaTela] = useState("boas_vindas");
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function restaurarSessao() {
      try {
        const resultadoSessao = await authApi.sessao();
        if (!ativo || !resultadoSessao.user) return;
        const resultadoPerfil = await profileApi.obter();
        if (!ativo) return;

        setUsuario({ ...resultadoSessao.user, nome: resultadoPerfil.profile.nome });
        setPerfil(resultadoPerfil.profile);
        setProximaTela(resultadoPerfil.profile.onboardingConcluido ? "home" : "onboarding");
      } catch {
        // Sem uma sessao valida, o fluxo publico de boas-vindas permanece ativo.
      }
    }

    restaurarSessao();
    return () => {
      ativo = false;
    };
  }, []);

  function navegarPara(destino) {
    setProximaTela(destino);
    setTela("splash");
  }

  async function entrarEIniciarOnboarding(credenciais) {
    const resultado = await authApi.entrar(credenciais);
    const resultadoPerfil = await profileApi.obter();
    setUsuario({ ...resultado.user, nome: resultadoPerfil.profile.nome });
    setPerfil(resultadoPerfil.profile);
    navegarPara(resultadoPerfil.profile.onboardingConcluido ? "home" : "onboarding");
    return resultado;
  }

  async function cadastrarEIniciarOnboarding(dados) {
    const resultado = await authApi.cadastrar(dados);
    if (!resultado.requiresEmailConfirmation) {
      setUsuario(resultado.user);
      setPerfil(null);
      navegarPara("onboarding");
    }
    return resultado;
  }

  async function concluirOnboarding(dados) {
    const resultado = await profileApi.concluirOnboarding(dados);
    setPerfil(resultado.profile);
    setUsuario((usuarioAtual) => ({
      ...usuarioAtual,
      nome: resultado.profile.nome || usuarioAtual?.nome,
    }));
    navegarPara("home");
  }

  if (tela === "splash") {
    return <SplashScreen key={proximaTela} aoConcluir={() => setTela(proximaTela)} />;
  }

  if (tela === "login") {
    return (
      <Login
        aoVoltar={() => navegarPara("boas_vindas")}
        aoEntrar={entrarEIniciarOnboarding}
        aoCadastrar={() => navegarPara("cadastro")}
      />
    );
  }

  if (tela === "cadastro") {
    return (
      <Cadastro
        aoVoltar={() => navegarPara("boas_vindas")}
        aoCriarConta={cadastrarEIniciarOnboarding}
        aoEntrar={() => navegarPara("login")}
        aoAbrirTermos={abrirDocumentoLegal}
        aoAbrirPrivacidade={abrirDocumentoLegal}
      />
    );
  }

  if (tela === "onboarding") {
    return <Onboarding perfil={perfil} aoConcluir={concluirOnboarding} />;
  }

  if (tela === "home") {
    return <Home key={usuario?.id} usuarioId={usuario?.id} nome={usuario?.nome} fotoUrl={perfil?.fotoUrl} aoFotoSalva={fotoUrl => setPerfil(atual => ({ ...atual, fotoUrl }))} metaDiaria={perfil?.metaDiaria || 10} aoEditarOnboarding={() => navegarPara("onboarding")} />;
  }

  return (
    <BoasVindas
      aoCriarConta={() => navegarPara("cadastro")}
      aoEntrar={() => navegarPara("login")}
    />
  );
}

export default App;
