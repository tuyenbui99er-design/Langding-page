const sizeChart = [
  { size: "S", waist: "66–68", length: 78, weight: "38–42" },
  { size: "M", waist: "70–72", length: 79, weight: "43–49" },
  { size: "L", waist: "74–76", length: 80, weight: "50–56" },
  { size: "XL", waist: "78–80", length: 81, weight: "57–63" },
  { size: "2XL", waist: "82–84", length: 82, weight: "64–70" },
  { size: "3XL", waist: "86–88", length: 83, weight: "71–76" },
] as const;

export default function SizeChart() {
  return (
    <>
      <table className="size-chart">
        <caption>Bảng size tham khảo của nhà bán hàng</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Vòng eo (cm)</th>
            <th scope="col">Chiều dài (cm)</th>
            <th scope="col">Cân nặng (kg)</th>
          </tr>
        </thead>
        <tbody>
          {sizeChart.map(({ size, waist, length, weight }) => (
            <tr key={size}>
              <th scope="row">{size}</th>
              <td>{waist}</td>
              <td>{length}</td>
              <td>{weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Cân nặng chỉ mang tính tham khảo. Hãy đối chiếu số đo trước khi chọn
        size; độ vừa vặn còn tùy vóc dáng.
      </p>
    </>
  );
}
