import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from typing import Optional, Tuple
import uuid
from loguru import logger
from app.core.config import settings


class S3Service:
    def __init__(self):
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            self.bucket = settings.AWS_S3_BUCKET
            self.available = True
            logger.info("S3 service initialized.")
        else:
            self.available = False
            logger.warning("AWS credentials not set. S3 uploads will be simulated.")

    async def upload_medical_report(
        self,
        file: UploadFile,
        user_id: str,
    ) -> Tuple[str, str]:
        """Upload PDF to S3. Returns (s3_key, presigned_url)."""
        if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
            raise HTTPException(400, "Only PDF, JPEG, PNG files allowed.")

        ext = file.filename.rsplit(".", 1)[-1].lower()
        s3_key = f"reports/{user_id}/{uuid.uuid4()}.{ext}"

        if not self.available:
            logger.info(f"[S3 Demo] Would upload: {s3_key}")
            return s3_key, f"https://demo-s3.example.com/{s3_key}"

        try:
            content = await file.read()
            self.client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type,
                ServerSideEncryption="AES256",
                Metadata={"user_id": user_id, "original_name": file.filename},
            )
            url = self._generate_presigned_url(s3_key)
            return s3_key, url
        except ClientError as e:
            logger.error(f"S3 upload error: {e}")
            raise HTTPException(500, "Failed to upload file.")

    def _generate_presigned_url(self, s3_key: str, expiry: int = 3600) -> str:
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_key},
                ExpiresIn=expiry,
            )
        except ClientError:
            return ""

    async def get_file_url(self, s3_key: str) -> str:
        if not self.available:
            return f"https://demo-s3.example.com/{s3_key}"
        return self._generate_presigned_url(s3_key)

    async def delete_file(self, s3_key: str) -> bool:
        if not self.available:
            return True
        try:
            self.client.delete_object(Bucket=self.bucket, Key=s3_key)
            return True
        except ClientError as e:
            logger.error(f"S3 delete error: {e}")
            return False


s3_service = S3Service()
