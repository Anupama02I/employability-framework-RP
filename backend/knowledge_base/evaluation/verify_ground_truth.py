import chromadb
from pathlib import Path


BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

VECTOR_STORE_DIR = (
    BASE_DIR
    / "vector_store"
    / "chroma"
)

COLLECTION_NAME = (
    "employability_kb_v1"
)


client = chromadb.PersistentClient(
    path=str(
        VECTOR_STORE_DIR
    )
)


collection = client.get_collection(
    COLLECTION_NAME
)


TARGETS = [
    "C005",
    "C008",
    "C012",
]


for corpus_id in TARGETS:

    print()
    print(
        "=" * 90
    )

    print(
        "CORPUS ID:",
        corpus_id
    )

    print(
        "=" * 90
    )


    result = collection.get(

        where={
            "corpus_id":
                corpus_id
        },

        include=[
            "documents",
            "metadatas",
        ],
    )


    documents = (
        result.get(
            "documents"
        )
        or []
    )

    metadatas = (
        result.get(
            "metadatas"
        )
        or []
    )


    print(
        "Chunks found:",
        len(documents)
    )


    if metadatas:

        print(
            "Title:",
            metadatas[0].get(
                "title"
            )
        )

        print(
            "Domain:",
            metadatas[0].get(
                "knowledge_domain"
            )
        )


    print()


    for i, document in enumerate(
        documents[:10],
        start=1
    ):

        print(
            f"--- Chunk {i} ---"
        )

        print(
            document[:1000]
        )

        print()