terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "local_file" "sample_file" {
  content  = var.content_text
  filename = "${path.module}/terraform_output.txt"
}
