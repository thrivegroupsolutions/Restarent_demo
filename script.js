function order(item){
  const message = encodeURIComponent(
    `Hello, I would like to order: ${item}`
  );
  window.open(`https://wa.me/447000000000?text=${message}`, "_blank");
}
