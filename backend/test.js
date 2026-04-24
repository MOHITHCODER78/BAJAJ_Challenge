const test = async () => {
  const req = await fetch('http://localhost:5000/bfhl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        "A->B", "A->C", "B->D", "C->E", "E->F",
        "X->Y", "Y->Z", "Z->X",
        "P->Q", "Q->R",
        "G->H", "G->H", "G->I",
        "hello", "1->2", "A->"
      ]
    })
  });
  const res = await req.json();
  console.log(JSON.stringify(res, null, 2));
}

test();
