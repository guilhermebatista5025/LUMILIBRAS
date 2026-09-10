import { useState } from "react";
import { BoasVindas } from "./pages/BoasVindas.jsx";
import { Cadastro } from "./pages/Cadastro.jsx";
import { Home } from "./pages/Home.jsx";
import { Login } from "./pages/Login.jsx";
import { Onboarding } from "./pages/Onboarding.jsx";
import { SplashScreen } from "./pages/SplashScreen.jsx";
import { authApi } from "./services/authApi.js";
import documentoLegalUrl from "../README-2.0.md?url";

function abrirDocumentoLegal() {
  window.open(documentoLegalUrl, "_blank", "noopener,noreferrer");
}

function App() {
  const [tela, setTela] = useState("splash");
  const [proximaTela, setProximaTela] = useState("boas_vindas");
  const [usuario, setUsuario] = useState(null);

  function navegarPara(destino) {
    setProximaTela(destino);
    setTela("splash");
  }

  async function entrarEIniciarOnboarding(credenciais) {
    const resultado = await authApi.entrar(credenciais);
    setUsuario(resultado.user);
    navegarPara("onboarding");
    return resultado;
  }

  async function cadastrarEIniciarOnboarding(dados) {
    const resultado = await authApi.cadastrar(dados);
    if (!resultado.requiresEmailConfirmation) {
      setUsuario(resultado.user);
      navegarPara("onboarding");
    }
    return resultado;
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
    return <Onboarding aoConcluir={() => navegarPara("home")} />;
  }

  if (tela === "home") {
    return <Home nome={usuario?.nome} />;
  }

  return (
    <BoasVindas
      aoCriarConta={() => navegarPara("cadastro")}
      aoEntrar={() => navegarPara("login")}
    />
  );
}

export default App;
