# -p 8443:8443 # Optionally map HTTPS port if you configure it
  # -e DRAWIO_SELF_CONTAINED=1 # Optional: Try this to minimize external calls, might affect some features
  # Add other necessary environment variables if needed (see jgraph/drawio docs)

docker run -d \
  --name=drawio \
  -p 8080:8080 \
  --restart=always \
  jgraph/drawio