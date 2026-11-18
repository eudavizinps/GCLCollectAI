import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './app/ContextoAutenticacao'
import { App } from './app/Aplicacao'
import './estilos/tema.css'
import './estilos/geral.css'
import './estilos/login.css'
import './estilos/responsividade.css'
import './estilos/pesquisa-clientes.css'
import './estilos/ficha-cliente.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
