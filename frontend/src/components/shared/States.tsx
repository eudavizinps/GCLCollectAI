export function LoadingState() { return <div className="state-panel loading-state"><div className="spinner"/>Carregando dados...</div> }
export function EmptyState({ message = 'Nenhum registro encontrado.' }: { message?: string }) { return <div className="state-panel">{message}</div> }
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) { return <div className="state-panel error-state">{message}{retry && <button className="text-button" onClick={retry}>Tentar novamente</button>}</div> }
