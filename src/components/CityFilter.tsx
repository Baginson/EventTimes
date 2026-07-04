type CityFilterProps = {
  value: string
  onChange: (city: string) => void
}

export function CityFilter({ value, onChange }: CityFilterProps) {
  return (
    <label className="search-filter city-filter">
      <span>Miasto</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="Leszno">Leszno</option>
      </select>
    </label>
  )
}
