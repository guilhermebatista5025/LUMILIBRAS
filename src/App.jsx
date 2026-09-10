import { useState } from "react";
import { BoasVindas } from "./pages/BoasVindas.jsx";
import { Cadastro } from "./pages/Cadastro.jsx";
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

  async function entrarEIniciarOnboarding(credenciais) {
    const resultado = await authApi.entrar(credenciais);
    setTela("onboarding");
    return resultado;
  }

  async function cadastrarEIniciarOnboarding(dados) {
    const resultado = await authApi.cadastrar(dados);
    if (!resultado.requiresEmailConfirmation) setTela("onboarding");
    return resultado;
  }

  if (tela === "splash") {
    return <SplashScreen aoConcluir={() => setTela("boas_vindas")} />;
  }

  if (tela === "login") {
    return (
      <Login
        aoVoltar={() => setTela("boas_vindas")}
        aoEntrar={entrarEIniciarOnboarding}
        aoCadastrar={() => setTela("cadastro")}
      />
    );
  }

  if (tela === "cadastro") {
    return (
      <Cadastro
        aoVoltar={() => setTela("boas_vindas")}
        aoCriarConta={cadastrarEIniciarOnboarding}
        aoEntrar={() => setTela("login")}
        aoAbrirTermos={abrirDocumentoLegal}
        aoAbrirPrivacidade={abrirDocumentoLegal}
      />
    );
  }

  if (tela === "onboarding") {
    return <Onboarding />;
  }

  return (
    <BoasVindas
      aoCriarConta={() => setTela("cadastro")}
      aoEntrar={() => setTela("login")}
    />
  );
}

export default App;
