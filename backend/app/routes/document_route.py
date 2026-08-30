import os
import tempfile

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from app.schemas.document_schema import (
    DocumentUploadResponse,
    UploadedDocumentType,
)

from app.services.document_service import (
    extract_text_from_pdf,
    extract_text_from_docx,
    process_uploaded_document,
)


router = APIRouter(
    prefix="/document",
    tags=["Document"]
)


MAX_FILE_SIZE_BYTES = (
    5 * 1024 * 1024
)


@router.post(
    "/upload",
    response_model=
        DocumentUploadResponse
)
async def upload_document(
    file: UploadFile = File(...)
):

    filename = (
        file.filename
        or
        "uploaded_document.pdf"
    )


    lower_filename = (
        filename.lower()
    )


    if not (
        lower_filename.endswith(".pdf")
        or
        lower_filename.endswith(".docx")
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are supported "
                "in the current version."
            )
        )


    content = await file.read()


    if not content:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded PDF is empty."
            )
        )


    if (
        len(content)
        >
        MAX_FILE_SIZE_BYTES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded PDF is too large. "
                "Maximum size is 5 MB."
            )
        )


    temp_path = None


    try:

        # Temporary file only.
        # It is not inserted into Chroma and is not
        # permanently stored by this endpoint.
        if lower_filename.endswith(
            ".pdf"
        ):

            file_suffix = ".pdf"

        else:

            file_suffix = ".docx"


        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=file_suffix
        ) as temp_file:

            temp_file.write(
                content
            )

            temp_path = (
                temp_file.name
            )

        if lower_filename.endswith(
            ".pdf"
        ):

            document_text = (
                extract_text_from_pdf(
                 temp_path
                )
            )

        else:

            document_text = (
                extract_text_from_docx(
                    temp_path
                )
            )


        if not document_text:
            raise HTTPException(
                status_code=400,
                detail=(
                    "We couldn't read text from this PDF. "
                    "It may be a scanned or image-based document. "
                    "Please upload a text-based PDF related to your "
                    "CV, a job, course, training, or career guidance."
                )
            )


        document_context = (
            process_uploaded_document(
                filename=
                    filename,
                document_text=
                    document_text,
            )
        )


        # Reject only documents outside the
        # employability/career scope.
        if (
            document_context.document_type
            ==
            UploadedDocumentType.UNSUPPORTED
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded PDF does not "
                    "appear to be related to "
                    "employability, careers, jobs, "
                    "education or training."
                )
            )


        return DocumentUploadResponse(
            success=
                True,
            filename=
                filename,
            document_type=
                document_context.document_type,
            extracted_text_length=
                len(document_text),
            document=
                document_context,
        )


    except HTTPException:
        raise


    except Exception as error:

        print()
        print("=" * 80)
        print("DOCUMENT PROCESSING ERROR")
        print("=" * 80)
        print(type(error).__name__)
        print(str(error))
        print("=" * 80)


        raise HTTPException(
            status_code=500,
            detail=(
                "The uploaded document could "
                "not be processed."
            )
        )


    finally:

        # Privacy: delete the temporary PDF.
        if (
            temp_path
            and
            os.path.exists(
                temp_path
            )
        ):
            try:
                os.remove(
                    temp_path
                )

            except Exception:
                pass