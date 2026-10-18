"""Lumio-specific hardening layers on top of the vision-agents library.

The installed ``vision-agents`` release (0.6.9) has known gaps around Gemini
Live: session-resumption handles are dropped, the reconnect path can kill the
event loop silently, and there is no stall detection. Everything here is a
local subclass/wrapper so the vendored package stays untouched.
"""
