'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./DirectoryTable.module.css";

const DirectoryTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [categories, setCategories] = useState([]); // Dynamic categories
  const [selectedCategories, setSelectedCategories] = useState([]); // Selected filters

  useEffect(() => {
    fetch("/data.json") // Adjust path based on Next.js setup
      .then((response) => response.json())
      .then((jsonData) => {
        setData(jsonData);
        setFilteredData(jsonData);

        // Extract unique categories dynamically
        const uniqueCategories = [...new Set(jsonData.map((item) => item.category))];
        setCategories(uniqueCategories);
        setSelectedCategories(uniqueCategories); // Default: All selected
      })
      .catch((error) => console.error("Error loading data:", error));
  }, []);

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category) // Remove category
      : [...selectedCategories, category]; // Add category

    setSelectedCategories(updatedCategories);

    // Filter data based on selected categories
    setFilteredData(data.filter((item) => updatedCategories.includes(item.category)));
  };

  return (
    <div>
      {/* Dynamic Filter Buttons */}
      {categories.length > 0 && (
        <fieldset className={styles.groups}>
          <legend>Filter by Category</legend>
          {categories.map((category, index) => (
            <input
              key={index}
              type="checkbox"
              className={`${styles.chip} ${styles.grow}`}
              role="switch"
              value={category}
              aria-label={category}
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryToggle(category)}
            />
          ))}
        </fieldset>
      )}

      {/* Table with 3 Columns */}
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>More Info</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>
                  <Link href={`/directory/${item.id}`} className={styles.moreInfoLink}>
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DirectoryTable;
