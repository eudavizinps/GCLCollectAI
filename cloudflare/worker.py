"""Cloudflare entry point for the fictional CollectAI demonstration."""
from workers import DurableObject, WorkerEntrypoint, asgi

from app import main as api
from app.core.storage import bind_durable_storage, unbind_durable_storage


api.CLOUDFLARE_RUNTIME = True


class CollectAIDemo(DurableObject):
    async def fetch(self, request):
        token = bind_durable_storage(self.ctx.storage)
        try:
            return await asgi.fetch(api.app, request, self.env)
        finally:
            unbind_durable_storage(token)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        stub = self.env.DEMO.getByName("collectai-fictional-demo")
        return await stub.fetch(request)
