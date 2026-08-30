from app.services.rag_service import (
    get_rag_context,
)


queries = [

    "What skills are required "
    "for a software developer?",

    "RPL කියන්නේ මොකක්ද?",

    "Sri Lankawe NYSC training "
    "centres monawada?",
]


for query in queries:

    print()
    print("=" * 90)

    print(
        "QUERY:",
        query
    )

    print("=" * 90)


    result = get_rag_context(
        query=query,
        top_k=5,
    )


    print(
        "Retrieved:",
        result[
            "retrieved_count"
        ]
    )


    for chunk in result[
        "chunks"
    ]:

        print()

        print(
            "Rank:",
            chunk[
                "rank"
            ]
        )

        print(
            "Title:",
            chunk[
                "title"
            ]
        )

        print(
            "Corpus:",
            chunk[
                "corpus_id"
            ]
        )

        print(
            "Distance:",
            round(
                chunk[
                    "distance"
                ],
                4
            )
        )

        print(
            chunk[
                "text"
            ][:300]
        )